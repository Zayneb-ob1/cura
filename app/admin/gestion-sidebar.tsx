import styles from "./admin.module.css";
import DashboardNavigation from "./dashboard-navigation";

export default function AdminSidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarIntro}>
        <p>Navigation</p>
        <strong>Gestion du cabinet</strong>
      </div>
      <DashboardNavigation />
      <div className={styles.sidebarFooter}>
        <span>Connecté en tant que</span>
        <strong>Administrateur</strong>
      </div>
    </aside>
  );
}
