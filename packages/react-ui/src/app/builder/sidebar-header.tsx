import { t } from 'i18next';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

type SidebarHeaderProps = {
  children: React.ReactNode;
  onClose: () => void;
};
const SidebarHeader = ({ children, onClose }: SidebarHeaderProps) => {
  return (
    <div className="flex px-4 py-2 w-full gap-2 text-lg font-semibold  items-center">
      {children}
      <div className="grow"></div>
      <Button
        variant="ghost"
        size={'sm'}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label={t('Close')}
      >
        <X size={16} />
      </Button>
    </div>
  );
};

export { SidebarHeader };
