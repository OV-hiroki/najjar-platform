import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id:      string;
      name:    string;
      email?:  string | null;
      phone:   string;
      role:    "STUDENT" | "ADMIN" | "TEACHER";
      avatar?: string;
    };
  }

  interface User {
    id:      string;
    name:    string;
    phone:   string;
    role:    "STUDENT" | "ADMIN" | "TEACHER";
    avatar?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:      string;
    phone:   string;
    role:    "STUDENT" | "ADMIN" | "TEACHER";
    avatar?: string;
  }
}
