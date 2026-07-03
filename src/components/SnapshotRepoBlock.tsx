import { Tabs, CodeTabItem } from './docs/Tabs.tsx';

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
    <Tabs defaultValue="maven" group="java-build-tools">
      <CodeTabItem value="maven" label="Maven" language="xml">{maven}</CodeTabItem>
      <CodeTabItem value="gradle-groovy" label="Gradle (Groovy)" language="groovy">{groovy}</CodeTabItem>
      <CodeTabItem value="gradle-kotlin" label="Gradle (Kotlin)" language="kotlin">{kotlin}</CodeTabItem>
    </Tabs>
  );
}