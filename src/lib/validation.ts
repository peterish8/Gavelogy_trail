// Data validation utilities for production use

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Please enter a valid email address");
  } else if (email.length > 254) {
    errors.push("Email is too long");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (password.length > 128) {
      errors.push("Password is too long");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Username validation
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];

  if (!username) {
    errors.push("Username is required");
  } else {
    if (username.length < 3) {
      errors.push("Username must be at least 3 characters long");
    }
    if (username.length > 30) {
      errors.push("Username is too long");
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push(
        "Username can only contain letters, numbers, underscores, and hyphens"
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Full name validation
export function validateFullName(fullName: string): ValidationResult {
  const errors: string[] = [];

  if (!fullName) {
    errors.push("Full name is required");
  } else {
    if (fullName.length < 2) {
      errors.push("Full name must be at least 2 characters long");
    }
    if (fullName.length > 100) {
      errors.push("Full name is too long");
    }
    if (!/^[a-zA-Z\s'-]+$/.test(fullName)) {
      errors.push(
        "Full name can only contain letters, spaces, hyphens, and apostrophes"
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

// Validate quiz answer
export function validateQuizAnswer(answer: number): ValidationResult {
  const errors: string[] = [];

  if (typeof answer !== "number") {
    errors.push("Answer must be a number");
  } else if (answer < 0 || answer > 3) {
    errors.push("Answer must be between 0 and 3");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate course ID
export function validateCourseId(courseId: string): ValidationResult {
  const errors: string[] = [];

  if (!courseId) {
    errors.push("Course ID is required");
  } else if (!/^[a-f0-9-]{36}$/.test(courseId)) {
    errors.push("Invalid course ID format");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Generic form validation
export function validateForm<T extends Record<string, any>>(
  data: T,
  validators: Partial<Record<keyof T, (value: any) => ValidationResult>>
): ValidationResult {
  const errors: string[] = [];

  for (const [field, validator] of Object.entries(validators)) {
    if (validator) {
      const result = validator(data[field]);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
