"use client";

import styles from "./MainPage.module.scss";
import Text from "../Shared/Text";

import { UserType } from "@/types/userType";

import PendingConsultations from "../Consultation/doctor/PendingConsultations/PendingConsultations";
import DoctorsConsultations from "../Consultation/doctor/MyConsultations/DoctorsConsultations";
import PatientConsultations from "../Consultation/patient/MyConsultations/PatientConsultations";
import PatientHealthAnalysisForm from "../Consultation/patient/PatientHealthAnalysisForm/PatientHealthAnalysisForm";
import { Id } from "../../../convex/_generated/dataModel";
import { useIsMobile } from "@/hooks/use-mobile";

const HeroSection = ({ userData }: { userData: UserType }) => {
  const isMobile = useIsMobile();

  return (
    <div className={styles.heroContainer}>
      <div className={styles.hero}>
        <Text
          value="Welcome, "
          fontSize={isMobile ? "lg" : "xxxl"}
          variant="h4"
          fontWeight="bold"
        />
        <Text
          value={
            userData?.role === "doctor"
              ? `Dr. ${userData?.fullName}`
              : `${userData?.fullName}`
          }
          fontSize={isMobile ? "lg" : "xxxl"}
          variant="h4"
          noWrap
          color="primary"
          fontWeight="bold"
        />
      </div>
      <Text
        value={
          userData?.role === "patient"
            ? "Get AI-powered medical analysis and connect with healthcare professionals"
            : "Review patient cases and manage appointments with our AI-powered platform"
        }
        color="gray"
        fontSize={isMobile ? "md" : "lg"}
        textAlign="center"
      />
    </div>
  );
};

const MainPage = ({ userData }: { userData: UserType }) => {
  if (userData?.role === "patient") {
    return (
      <div className={styles.main}>
        <HeroSection userData={userData} />
        <PatientHealthAnalysisForm />
        <PatientConsultations
          userId={userData?._id as Id<"patientProfiles"> | null}
        />
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <HeroSection userData={userData} />
      <DoctorsConsultations />
      <PendingConsultations
        userId={userData?._id as Id<"doctorProfiles"> | null}
      />
    </div>
  );
};

export default MainPage;
