// filepath: d:\project-bolt-sb1-7wuo3n57\Dineingo\src\authUtils.ts
import { sendSignInLinkToEmail, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase"; // Import Firebase auth instance

const actionCodeSettings = {
  url: window.location.origin + '/finishSignUp',
  handleCodeInApp: true,
  iOS: {
    bundleId: 'com.dineingo.ios'
  },
  android: {
    packageName: 'com.dineingo.android',
    installApp: true,
    minimumVersion: '12'
  },
  dynamicLinkDomain: 'dineingo.page.link'
};

export const sendSignInEmail = async (email: string) => {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    console.log("Sign-in email sent!");
    window.localStorage.setItem("emailForSignIn", email);
    return { success: true, message: "Sign-in email sent successfully!" };
  } catch (error: any) {
    console.error("Error sending sign-in email:", error);
    return { 
      success: false, 
      message: error.message || "Failed to send sign-in email" 
    };
  }
};

export const sendPasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    console.log("Password reset email sent!");
    return { success: true, message: "Password reset email sent successfully!" };
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return { 
      success: false, 
      message: error.message || "Failed to send password reset email" 
    };
  }
};
