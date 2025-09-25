"use client";

export default function TestLogos() {
  const logos = [
    { name: 'Nedbank', path: '/Nedbank_logo_small.jpg' },
    { name: 'Absa', path: '/Absa_Logo.png' },
    { name: 'MRP', path: '/mrp.jpg' },
    { name: 'Vector Logistics', path: '/vector-logistics-logo.png' },
    { name: 'BP', path: '/bp-logo.png' }
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Logo Test Page</h1>
      <div className="grid grid-cols-3 gap-4">
        {logos.map((logo) => (
          <div key={logo.name} className="border p-4 rounded">
            <h3 className="font-semibold mb-2">{logo.name}</h3>
            <p className="text-sm text-gray-600 mb-2">Path: {logo.path}</p>
            <img
              src={logo.path}
              alt={logo.name}
              className="w-16 h-16 object-contain bg-gray-100 p-1 rounded"
              onLoad={() => console.log(`✅ ${logo.name} loaded successfully`)}
              onError={() => console.log(`❌ ${logo.name} failed to load from ${logo.path}`)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}