import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");

    const body = await request.json();
    const { courseId } = body;
    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Verify the token is valid by fetching user via Convex
    const me = await fetchQuery(api.users.getMe, {}, { token });
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch course details from Convex
    const courses = await fetchQuery(api.content.getCourses, { activeOnly: false });
    const course = courses.find((c) => c._id === courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (!course.is_active) {
      return NextResponse.json({ error: "Course is not available" }, { status: 400 });
    }

    // Create Razorpay order (instantiated here so env vars are available at runtime)
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(course.price * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        courseId: course._id,
        courseName: course.name,
        userId: me._id,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      courseName: course.name,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
