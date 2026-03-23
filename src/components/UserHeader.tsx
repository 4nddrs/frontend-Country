import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface UserHeaderProps {
  title: string;
  backPath?: string;
}

export default function UserHeader({ title, backPath }: UserHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center">
        {backPath ? (
          <Link to={backPath} className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors absolute left-0">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
        ) : null}

        <h1 className="text-3xl font-bold text-center text-[#bdab62]">
          {title}
        </h1>
      </div>

      {/* Sidebar toggle is centralized in SidebarUser */}
    </div>
  );
}



