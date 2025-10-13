import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface UserHeaderProps {
  title: string;
  backPath?: string;
}

export default function UserHeader({ title, backPath }: UserHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8 md:mb-12">
      <div className="flex items-center gap-2 md:gap-4">
        {backPath ? (
          <Link to={backPath} className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
        ) : null}

        <h1 className="text-3xl md:text-4xl bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
          {title}
        </h1>
      </div>

      {/* Sidebar toggle is centralized in SidebarUser */}
    </div>
  );
}
