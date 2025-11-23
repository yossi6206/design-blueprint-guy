import { Sidebar } from "@/components/Sidebar";
import { Feed } from "@/components/Feed";
import { RightSidebar } from "@/components/RightSidebar";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background justify-center">
      <div className="flex w-full max-w-[1440px]">
        <Sidebar />
        <Feed />
        <RightSidebar />
      </div>
    </div>
  );
};

export default Index;
