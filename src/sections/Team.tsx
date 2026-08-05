import { Github } from 'lucide-react';
import { DiscordIcon } from '@/components/DiscordIcon';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TEAM_MEMBERS, SITE_CONFIG } from '@/config/site';

import ElectricBorder from '@/components/ElectricBorder';
import { Reveal, RevealGroup, RevealItem } from '@/components/animators/Reveal';

function TeamMemberCard({ member, index }: { member: typeof TEAM_MEMBERS[number], index: number }) {
  const displayName = member.displayName || member.name;

  const avatarElement = (
    <div className="relative shrink-0">
      <div
        className="absolute inset-0 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"
        style={{ backgroundColor: member.electricColor || 'var(--primary)' }}
      />
      <Avatar
        className="w-16 h-16 ring-2 ring-border/30 group-hover:ring-primary/50 transition-all duration-300"
      >
        {member.avatar ? (
          <AvatarImage src={member.avatar} alt={displayName} />
        ) : null}
        <AvatarFallback className="text-lg bg-muted/50 text-primary">
          {displayName.split(' ').map((n: string) => (n[0] || '')).join('')}
        </AvatarFallback>
      </Avatar>
    </div>
  );

  const infoContent = (
    <div className="flex flex-col min-w-0">
      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate text-balance">
        {displayName}
      </h3>
      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider opacity-70 mb-3 truncate">
        {member.role}
      </p>
      <div className="flex items-center gap-2">
        {member.github && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="touch-target rounded-full hover:bg-accent transition-colors"
            style={{ color: member.electricColor }}
          >
            <a
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${displayName} GitHub`}
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>
        )}
        {/* Keyed on the numeric id, not the username: discord.com/users only
            resolves snowflakes, so a username here would be a dead link. */}
        {member.discordId && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="touch-target rounded-full hover:bg-accent transition-colors"
            style={{ color: member.electricColor }}
          >
            <a
              href={`https://discord.com/users/${member.discordId}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={member.discord ? `${displayName} on Discord (${member.discord})` : `${displayName} on Discord`}
            >
              <DiscordIcon className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );

  const cardContent = (
    <Card
      className="relative border-border/20 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300 group-hover:-translate-y-0.5"
      style={{
        background: member.color
          ? `linear-gradient(135deg, ${member.color}11, ${member.color}22)`
          : undefined
      }}
    >
      <CardContent className="p-4 flex items-center gap-4">
        {avatarElement}
        {infoContent}
      </CardContent>
    </Card>
  );

  return (
    <div className="relative group" style={{ animationDelay: `${index * 100}ms` }}>
      {member.electric ? (
        <ElectricBorder
          color={member.electricColor}
          speed={0.8}
          chaos={0.1}
          borderRadius={12}
        >
          {cardContent}
        </ElectricBorder>
      ) : (
        <div>
          <div
            className="absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"
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
        <Reveal className="text-center mb-16" amount={0.5}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
            Team
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The people behind Mevera Studios and its open-source libraries.
          </p>
        </Reveal>

        {/* Team Row — horizontal cards */}
        <RevealGroup stagger={0.1} className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
          {TEAM_MEMBERS.map((member, index) => (
            <RevealItem key={member.name} className="w-full sm:w-80">
              <TeamMemberCard member={member} index={index} />
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Contributors Link */}
        <Reveal className="text-center mt-12" amount={0.5}>
          <Button variant="outline" size="lg" asChild className="rounded-full border-border/40 text-foreground hover:text-primary hover:border-primary/40 transition-colors">
            <a
              href={`${SITE_CONFIG.githubUrl}/graphs/contributors`}
              target="_blank"
              rel="noopener noreferrer"
            >
              See all contributors
              <Github className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
