"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const RedirectToLogin = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/authentication/login"); 
  }, [router]);

  return null; 
};

export default RedirectToLogin;
