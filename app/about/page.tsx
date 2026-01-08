export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About Us</h1>
        <div className="space-y-6 text-zinc-300">
          <p className="text-lg leading-relaxed">
            Welcome to Medikal, your trusted medical information and services
            platform.
          </p>
          <p className="leading-relaxed">
            This page will contain information about your medical site, mission,
            and values.
          </p>
        </div>
      </div>
    </div>
  );
}
