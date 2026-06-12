import { InteractiveTravelCard } from "@/components/ui/3d-card";

export default function InteractiveTravelCardDemo() {
  return (
    // The container uses theme variables and provides perspective for the 3D effect.
    <div className="flex min-h-[30rem] w-full items-center justify-center bg-background p-8">
       <div 
        style={{
          perspective: "1000px"
        }}
       >
        <InteractiveTravelCard
          title="Sapa Valley"
          subtitle="Vietnam"
          imageUrl="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          actionText="Book your trip"
          href="https://en.wikipedia.org/wiki/Sa_Pa"
          onActionClick={() => {
            alert("This action can be customized via the onActionClick prop.");
          }}
        />
      </div>
    </div>
  );
}
