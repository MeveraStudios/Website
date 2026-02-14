import LatestVersion from './LatestVersion.tsx';
import { Tabs, TabItem } from './docs/Tabs.tsx';
import { CodeBlock } from './docs/CodeBlock.tsx';

interface LatestVersionBlockProps {
  owner: string;
  repo: string;
  group: string;
  id: string;
}

export default function LatestVersionBlock({ owner, repo, group, id }: LatestVersionBlockProps) {
  return (
    <LatestVersion owner={owner} repo={repo}>
      {(v: string) => {
        const maven = `<dependency>
  <groupId>${group}</groupId>
  <artifactId>${id}</artifactId>
  <version>${v}</version>
</dependency>`;

        const groovy = `implementation '${group}:${id}:${v}'`;
        const kotlin = `implementation("${group}:${id}:${v}")`;

        return (
          <Tabs defaultValue="maven">
            <TabItem value="maven" label="Maven">
              <CodeBlock className="language-xml">{maven}</CodeBlock>
            </TabItem>
            <TabItem value="gradle-groovy" label="Gradle (Groovy)">
              <CodeBlock className="language-groovy">{groovy}</CodeBlock>
            </TabItem>
            <TabItem value="gradle-kotlin" label="Gradle (Kotlin)">
              <CodeBlock className="language-kotlin">{kotlin}</CodeBlock>
            </TabItem>
          </Tabs>
        );
      }}
    </LatestVersion>
  );
}

