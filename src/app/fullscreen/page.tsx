import ChartControls from "@/components/ChartControls";

export default function FullscreenPage() {
  return (
    <div className="p-10 flex items-center justify-center">
      <ChartControls isFullscreen={true} />
    </div>
  );
}

