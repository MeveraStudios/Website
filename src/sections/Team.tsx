import { Github, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TEAM_MEMBERS, SITE_CONFIG } from '@/config/site';

import ElectricBorder from '@/components/ElectricBorder';

function TeamMemberCard({ member, index }: { member: typeof TEAM_MEMBERS[number], index: number }) {
  const displayName = member.displayName || member.name;

  const cardContent = (
    <Card
      className="relative h-full border-white/5 bg-black/40 backdrop-blur-md overflow-hidden transition-all duration-300 group-hover:-translate-y-1"
      style={{
        background: member.color
          ? `linear-gradient(135deg, ${member.color}11, ${member.color}22)`
          : undefined
      }}
    >
      <CardContent className="p-6 text-center flex flex-col items-center">
        {/* Avatar Ring */}
        <div className="relative mb-6">
          <div
            className="absolute inset-0 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"
            style={{ backgroundColor: member.electricColor || 'var(--primary)' }}
          />
          <Avatar className="w-24 h-24 ring-2 ring-white/10 group-hover:ring-primary/50 transition-all duration-300">
            {member.avatar ? (
              <AvatarImage src={member.avatar} alt={displayName} />
            ) : null}
            <AvatarFallback className="text-2xl bg-black/50 text-primary">
              {displayName.split(' ').map((n: string) => (n[0] || '')).join('')}
            </AvatarFallback>
          </Avatar>
        </div>

        <h3
          className="text-xl font-bold mb-1 text-foreground transition-colors group-hover:text-primary"
        >
          {displayName}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 font-mono text-xs uppercase tracking-wider opacity-70">
          {member.role}
        </p>

        {/* Social Links */}
        <div className="flex items-center justify-center gap-3 mt-auto pt-4">
          {member.github && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-full hover:bg-white/10 transition-colors"
              style={{ color: member.electricColor }}
            >
              <a
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${displayName} GitHub`}
              >
                <Github className="h-5 w-5" />
              </a>
            </Button>
          )}

          {member.discord && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-full hover:bg-white/10 transition-colors"
              style={{ color: member.electricColor }}
            >
              <a
                href={`https://discord.com/users/${member.discord}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${displayName} Discord`}
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="relative group h-full" style={{ animationDelay: `${index * 100}ms` }}>
      {member.electric ? (
        <ElectricBorder
          color={member.electricColor}
          speed={0.8}
          chaos={0.1}
          borderRadius={24}
          className="h-full"
        >
          {cardContent}
        </ElectricBorder>
      ) : (
        <div className="h-full">
          <div
            className="absolute -inset-0.5 rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-500"
            style={{ backgroundColor: member.electricColor }}
          />
          {cardContent}
        </div>
      )}
    </div>
  );
}

export function Team() {
  return (
    <section id="team" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Our Team
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We are a passionate team of developers creating open-source projects for the community.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {TEAM_MEMBERS.map((member, index) => (
            <TeamMemberCard key={member.name} member={member} index={index} />
          ))}
        </div>

        {/* Contributors Link */}
        <div className="text-center mt-12">
          <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent">
            <Button variant="link" asChild className="text-muted-foreground hover:text-primary transition-colors">
              <a
                href={`${SITE_CONFIG.githubUrl}/graphs/contributors`}
                target="_blank"
                rel="noopener noreferrer"
              >
                And many more contributors!
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
