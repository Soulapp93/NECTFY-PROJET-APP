 import React from 'react';
 import { Link } from 'react-router-dom';
 import { X, Lightbulb, LayoutGrid, FileText, HelpCircle, Mail } from 'lucide-react';
 import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
 
 interface MobileDrawerNavigationProps {
   isOpen: boolean;
   onClose: () => void;
 }
 
 const MobileDrawerNavigation: React.FC<MobileDrawerNavigationProps> = ({ isOpen, onClose }) => {
   const navItems = [
     { label: 'Solutions', href: '#fonctionnalites', icon: Lightbulb, isAnchor: true },
     { label: 'Fonctionnalités', href: '/fonctionnalites', icon: LayoutGrid, isAnchor: false },
     { label: 'Articles & Blog', href: '/blog', icon: FileText, isAnchor: false },
     { label: 'Pourquoi nous ?', href: '/pourquoi-nous', icon: HelpCircle, isAnchor: false },
     { label: 'Contact', href: '#contact', icon: Mail, isAnchor: true },
   ];
 
   const handleNavClick = (isAnchor: boolean) => {
     if (isAnchor) {
       onClose();
     }
   };
 
   return (
     <Sheet open={isOpen} onOpenChange={onClose}>
       <SheetContent side="left" className="w-[280px] p-0 border-r-0 bg-gradient-to-b from-primary via-primary to-accent">
         <div className="flex flex-col h-full">
           {/* Header du menu */}
           <SheetHeader className="p-4 border-b border-white/10">
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                   <span className="text-white font-bold text-sm">NF</span>
                 </div>
                 <SheetTitle className="text-xl font-bold text-white">NECTFORMA</SheetTitle>
               </div>
             </div>
           </SheetHeader>
 
           {/* Navigation Links */}
           <nav className="flex-1 p-4 space-y-2">
             {navItems.map((item) => {
               const Icon = item.icon;
               
               if (item.isAnchor) {
                 return (
                   <a
                     key={item.label}
                     href={item.href}
                     onClick={() => handleNavClick(true)}
                     className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:text-white hover:bg-white/15 transition-all duration-200 group"
                   >
                     <Icon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                     <span className="font-medium">{item.label}</span>
                   </a>
                 );
               }
 
               return (
                 <Link
                   key={item.label}
                   to={item.href}
                   onClick={onClose}
                   className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:text-white hover:bg-white/15 transition-all duration-200 group"
                 >
                   <Icon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                   <span className="font-medium">{item.label}</span>
                 </Link>
               );
             })}
           </nav>
 
           {/* Footer actions */}
           <div className="p-4 border-t border-white/10 space-y-3">
             <Link
               to="/auth"
               onClick={onClose}
               className="block w-full text-center px-4 py-3 rounded-xl text-white font-medium hover:bg-white/10 transition-all duration-200 border border-white/30"
             >
               Se connecter
             </Link>
             <Link
               to="/create-establishment"
               onClick={onClose}
               className="block w-full text-center px-4 py-3 rounded-xl bg-white text-primary font-semibold hover:bg-white/90 transition-all duration-200 shadow-lg"
             >
               Créer un compte
             </Link>
           </div>
         </div>
       </SheetContent>
     </Sheet>
   );
 };
 
 export default MobileDrawerNavigation;