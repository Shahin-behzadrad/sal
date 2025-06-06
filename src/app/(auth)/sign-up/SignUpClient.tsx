"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Shared/Button/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/Shared/Card";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import styles from "./SignUp.module.scss";
import TextField from "@/components/Shared/TextField";
import { useLanguage } from "@/i18n/LanguageContext";

export default function SignUpClient() {
  const { signIn, signOut } = useAuthActions();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const { messages } = useLanguage();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First check if email exists
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", "signIn");

      try {
        await signIn("password", formData);
        toast.warning(messages.auth.emailExists);
        signOut();

        router.push("/sign-in");
        return;
      } catch (error: any) {
        const errorMessage = error?.message || "";
        if (!errorMessage.includes("InvalidAccountId")) {
          throw error;
        }
      }

      // If email doesn't exist, proceed with sign up
      const signUpFormData = new FormData();
      signUpFormData.set("email", email);
      signUpFormData.set("password", password);
      signUpFormData.set("flow", "signUp");

      await signIn("password", signUpFormData).then((res) => {});
    } catch (error: any) {
      console.error("Sign-up error:", error);
      const errorMessage = error?.message || "";

      if (errorMessage.includes("InvalidAccountId")) {
        toast(messages.auth.invalidEmail);
      } else if (
        errorMessage.includes("InvalidSecret") ||
        errorMessage.includes("Invalid password")
      ) {
        setPasswordError(messages.auth.invalidPassword);
        toast.warning(messages.auth.invalidPassword);
      } else {
        toast.error(messages.auth.unexpectedError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSignUpStep = () => (
    <>
      <CardHeader
        title={messages.auth.createAccount}
        subheader={messages.auth.enterCredentials}
      />
      <form onSubmit={handleSignUp}>
        <CardContent>
          <div className={styles.formGrid}>
            <TextField
              label={messages.auth.email}
              id="email"
              type="email"
              placeholder="m.johnson@example.com"
              value={email}
              onChangeText={setEmail}
              required
            />

            <TextField
              id="password"
              label={messages.auth.password}
              type={showPassword ? "text" : "password"}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setPasswordError(""); // Clear error when user types
              }}
              required
              error={!!passwordError}
              helperText={passwordError}
              endAdornment={
                <Button onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              }
            />
          </div>
        </CardContent>
        <CardFooter className={styles.footer}>
          <Button
            type="submit"
            size="lg"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
          >
            {isSubmitting
              ? messages.auth.creatingAccount
              : messages.common.continue}
          </Button>
          <div className={styles.signInText}>
            {messages.auth.alreadyHaveAccount}{" "}
            <Link href="/sign-in" className={styles.signInLink}>
              {messages.auth.signIn}
            </Link>
          </div>
        </CardFooter>
      </form>
    </>
  );

  return (
    <div className={styles.container}>
      <Card className={styles.card}>{renderSignUpStep()}</Card>
    </div>
  );
}
