import { UserType } from "@/types/userType";
import { Card, CardContent } from "../Shared/Card";
import { Text } from "../Shared/Text/Text";
import { ProfileImageUpload } from "../ProfileImageUpload/ProfileImageUpload";
import styles from "./ProfileScreen.module.scss";
import Grid from "../Shared/Grid/Grid";
import { User } from "lucide-react";
import { ProfileFormPage } from "./ProfileFormPage";
import { useLanguage } from "@/i18n/LanguageContext";

interface ProfileScreenProps {
  userData?: UserType | null;
}

const ProfileScreen = ({ userData }: ProfileScreenProps) => {
  const { messages } = useLanguage();

  if (!userData) return null;

  return (
    <div className={styles.container}>
      <div>
        <Text
          value={`${userData?.role ? userData?.role?.charAt(0).toUpperCase() + userData?.role?.slice(1) : ""} ${messages.profile.title}`}
          variant="h4"
          fontWeight="bold"
        />
        <Text
          value={messages.profile.manageProfile}
          color="gray"
          fontSize="sm"
        />
      </div>
      <Grid container spacing={8} className={styles.gridContainer}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent className={styles.sidebarContent}>
              <ProfileImageUpload currentImageUrl={userData.profileImage} />
              <Text
                value={userData.fullName || ""}
                fontWeight="bold"
                fontSize="lg"
                noWrap
                textAlign="center"
              />
              {userData.role === "doctor" && userData.specialization && (
                <div className={styles.specialization}>
                  <Text value={userData.specialization} fontSize="sm" />
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={9}>
          <Card>
            <CardContent>
              <Text
                className={styles.title}
                value={messages.profile.personalInfo}
                fontWeight="bold"
                fontSize="xl"
                startAdornment={<User size={20} />}
              />
              <Text
                value={messages.profile.basicInfo}
                color="gray"
                fontSize="sm"
              />
              <ProfileFormPage userData={userData} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default ProfileScreen;
