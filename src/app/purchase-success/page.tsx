"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { DottedBackground } from "@/components/DottedBackground";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, ArrowRight } from "lucide-react";

function PurchaseSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get order details from URL params
  const orderId = searchParams.get("orderId") || `ORDER_${Date.now()}`;
  const courseName = searchParams.get("course") || "Your Course";
  const amount = searchParams.get("amount") ? parseFloat(searchParams.get("amount")!) : 0;

  const handleDownloadReceipt = () => {
    alert("Receipt download feature will be implemented in the next phase!");
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-green-800 dark:text-green-200">
              Purchase Successful!
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Your course is now active and ready to use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
              {courseName !== "Your Course" && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Course:</span>
                  <span>{courseName}</span>
                </div>
              )}
              {amount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Amount:</span>
                  <span className="text-lg font-bold text-primary">
                    ₹{amount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-medium">Order ID:</span>
                <span className="font-mono text-sm">
                  {orderId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Status:</span>
                <span className="text-green-600 font-medium">✅ Active</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => router.push("/dashboard")}
                className="flex-1"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadReceipt}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                You can now access all course content from your dashboard.
              </p>
              <p>Start your CLAT PG preparation journey today!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <div className="min-h-screen">
      <DottedBackground />
      <Header />
      <Suspense fallback={
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Loading...</div>
        </div>
      }>
        <PurchaseSuccessContent />
      </Suspense>
    </div>
  );
}

