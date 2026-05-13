import { ProjectProvider } from "@/context/project-context";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectProvider>
      <div className="app">
        <Sidebar />
        <div className="main">
          <TopBar />
          {children}
        </div>
      </div>
    </ProjectProvider>
  );
}
