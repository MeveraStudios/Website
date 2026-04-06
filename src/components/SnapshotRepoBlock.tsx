import { Tabs, TabItem } from './docs/Tabs.tsx';
import { CodeBlock } from './docs/CodeBlock.tsx';

export default function SnapshotRepoBlock() {
  const maven = `<repository>
  <id>ossrh-snapshots</id>
  <url>https://s01.oss.sonatype.org/content/repositories/snapshots/</url>
</repository>`;

  const groovy = `maven {
    url = "https://s01.oss.sonatype.org/content/repositories/snapshots/"
}`;

  const kotlin = `maven {
    url = uri("https://s01.oss.sonatype.org/content/repositories/snapshots/")
}`;

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
}