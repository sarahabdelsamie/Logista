import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const AppLayout = ({ children, breadcrumbs = [] }) => {
  return (
    <div className="min-h-screen bg-[#F0F2F7]">
      <Sidebar />
      <div className="ml-60 min-h-screen flex flex-col">
        <TopNavbar breadcrumbs={breadcrumbs} />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
