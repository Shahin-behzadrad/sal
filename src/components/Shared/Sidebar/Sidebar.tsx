import { FC, useEffect } from "react";
import Button from "../Button";
import { SignOutButton } from "../../SignOutButton/SignOutButton";
import { UserProfile } from "../UserProfile/UserProfile";
import styles from "./Sidebar.module.scss";
import clsx from "clsx";
import { X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useApp } from "@/lib/AppContext";

interface SidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userData?: {
    _id: string;
    fullName?: string;
  } | null;
}

const Sidebar: FC<SidebarProps> = ({ isOpen, onOpenChange, userData }) => {
  const { setView } = useApp();
  const { messages } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  return (
    <>
      <div
        className={clsx(styles.backdrop, {
          [styles.invisible]: !isOpen,
        })}
        onClick={() => onOpenChange(false)}
      />
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
        role="complementary"
      >
        <div className={styles.sidebarContainer}>
          <Button
            className={styles.closeButton}
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X />
          </Button>

          {userData?._id ? (
            <>
              <div className={styles.profileSection}>
                <UserProfile
                  userData={userData}
                  onCloseSidebar={() => onOpenChange(false)}
                />
              </div>
              <div className={styles.profileSection}>
                <SignOutButton handleSignOut={() => onOpenChange(false)} />
              </div>
            </>
          ) : (
            <div className={styles.authSection}>
              <Button
                variant="outlined"
                onClick={() => {
                  onOpenChange(false);
                  setView("sign-in");
                }}
              >
                {messages.auth.signIn}
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  onOpenChange(false);
                  setView("sign-up");
                }}
              >
                {messages.auth.signUp}
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
