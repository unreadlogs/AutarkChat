import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hash } from "bcrypt-ts";
import { getUserByEmail, createUser } from "@/lib/queries";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser && !existingUser.isAnonymous) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);
    const user = await createUser({
      email,
      password: hashedPassword,
      isAnonymous: false,
    });

    const cookieStore = await cookies();
    cookieStore.set("session_user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isAnonymous: user.isAnonymous,
      },
    });
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
