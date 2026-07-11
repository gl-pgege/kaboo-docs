import { useState, useEffect } from "react";
import { CopilotChat } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import {
  KabooProvider,
  DrillDetailView,
  GlassTabs,
  useDrill,
} from "@pgege/kaboo-react";
import { KabooMessageView } from "@pgege/kaboo-react/copilotkit";
import "@pgege/kaboo-react/styles.css";
import { ThemeToggle } from "@/components/ThemeToggle";

function useManifest(url: string) {
  const [entry, setEntry] = useState<string | null>(null);
  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((data) => setEntry(data.entry))
      .catch(() => {});
  }, [url]);
  return entry;
}

function ContentArea() {
  const { activeDrill } = useDrill();
  const isDrilled = !!activeDrill;

  return (
    <div className="flex-1 min-h-0 overflow-hidden relative">
      <div className={`h-full ${isDrilled ? "hidden" : "block"}`}>
        <CopilotChat
          labels={{
            title: "Market Research Assistant",
            initial:
              "Ask me to research companies, compare products, or analyze market trends. You can attach screenshots or documents.",
          }}
          messageView={KabooMessageView}
        />
      </div>
      <DrillDetailView />
    </div>
  );
}

function App() {
  const entry = useManifest("/api/manifest");
  const [threadId] = useState(() => crypto.randomUUID());

  if (!entry) {
    return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <KabooProvider runtimeUrl="/api/copilotkit" agent={entry} threadId={threadId}>
      <div className="h-screen flex flex-col bg-background text-foreground">
        <header className="px-6 py-4 border-b border-border bg-background flex items-center justify-between">
          <div>
            <h1 className="m-0 text-xl font-semibold">
              Market Research Assistant
            </h1>
            <p className="mt-1 mb-0 text-sm text-muted-foreground">
              Research companies, compare products, and analyze market trends
            </p>
          </div>
          <ThemeToggle />
        </header>
        <GlassTabs />
        <ContentArea />
      </div>
    </KabooProvider>
  );
}

export default App;
