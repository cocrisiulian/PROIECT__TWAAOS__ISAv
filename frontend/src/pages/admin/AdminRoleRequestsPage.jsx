import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher.jsx';
import AdminRoleRequests from '../../components/admin/AdminRoleRequests.jsx';
import PageFrame from '../../components/layout/PageFrame.jsx';

export default function AdminRoleRequestsPage() {
  const { t } = useTranslation();

  return (
    <PageFrame
      title="Role Upgrade Requests"
      subtitle="Manage user requests to upgrade from visitor to student or organizer"
      actions={<LanguageSwitcher />}
      contentClassName="space-y-6"
    >
      <AdminRoleRequests />
    </PageFrame>
  );
}
