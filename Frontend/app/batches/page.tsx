import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function BatchesPage() {
  // Your existing code
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Batches</h1>
        <Link 
          href="/batches/create" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusCircle className="h-5 w-5 mr-2" /> Create Batch
        </Link>
      </div>
      
      {/* Batches list */}
      {/* ... your existing code ... */}
    </div>
  );
}