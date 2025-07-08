"use client"

import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Camera,
  Lock,
  MapPin,
  Briefcase,
  DollarSign,
  FileText,
  Eye,
  History,
  X
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function ProfileMenu() {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  const menuSections = [
    {
      title: "My Account",
      items: [
        { icon: User, label: "View & Edit Profile", href: "/profile" },
        { icon: Camera, label: "Upload Profile Picture", href: "/profile/photo" },
        { icon: Lock, label: "Change Password", href: "/profile/password" },
        { icon: MapPin, label: "Job Preferences", href: "/profile/preferences" },
        { icon: FileText, label: "Notes & Follow-Ups", href: "/profile/notes" }
      ]
    },
    {
      title: "Billing & Subscription", 
      items: [
        { icon: CreditCard, label: "Current Plan", href: "/billing/plan" },
        { icon: DollarSign, label: "Upgrade/Downgrade", href: "/pricing" },
        { icon: History, label: "Payment History", href: "/billing/history" },
        { icon: X, label: "Cancel Subscription", href: "/billing/cancel" }
      ]
    },
    {
      title: "Settings",
      items: [
        { icon: Bell, label: "Notification Preferences", href: "/settings/notifications" },
        { icon: Briefcase, label: "Job Alert Frequency", href: "/settings/alerts" },
        { icon: Eye, label: "Resume Privacy Options", href: "/settings/privacy" }
      ]
    }
  ]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {user?.user_metadata?.full_name || user?.email || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title}>
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
              <div className="px-2 pb-2">
                {section.items.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="h-4 w-4 text-gray-500" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </a>
                ))}
              </div>
              {sectionIndex < menuSections.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        <Separator />
        <div className="p-2">
          <a
            href="/support"
            className="flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors w-full"
            onClick={() => setIsOpen(false)}
          >
            <HelpCircle className="h-4 w-4 text-gray-500" />
            <span>Contact Support</span>
            <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
          </a>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}