import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const UserAvatar = ({ user, className }) => (
  <Avatar className={cn("size-8 border", className)}>
    {user?.profile?.profilePhoto ? <AvatarImage src={user.profile.profilePhoto} alt="" /> : null}
    <AvatarFallback className="bg-brand-soft text-brand text-xs font-semibold">{initials(user?.fullName)}</AvatarFallback>
  </Avatar>
);

export default UserAvatar;
