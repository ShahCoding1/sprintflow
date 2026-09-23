import { Header } from "@/components/layout/header/Header";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { sessionService } from "@/server/services/session.service";
import { workspaceService } from "@/server/services/workspace.service";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const [workspaces, user] = await Promise.all([
    workspaceService.getUserWorkspaces(),
    sessionService.getCurrentUser(),
  ]);

  const currentWorkspace = workspaces[0] ?? null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        workspace={currentWorkspace}
        workspaces={workspaces}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} />

        <main className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}