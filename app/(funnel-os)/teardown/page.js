import TeardownConsole from "@/components/teardown/TeardownConsole";
import { defaultReport } from "@/lib/teardown/reports";

export default function NewTeardownPage() {
  return <TeardownConsole report={defaultReport} start="idle" />;
}
