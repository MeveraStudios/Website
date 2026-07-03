import { Tabs, TabItem } from './docs/Tabs.tsx';
import { CodeBlock } from './docs/CodeBlock.tsx';

export default function ShadingBlock() {
  const maven = `<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-shade-plugin</artifactId>
  <version>3.6.0</version>
  <executions>
    <execution>
      <phase>package</phase>
      <goals>
        <goal>shade</goal>
      </goals>
      <configuration>
        <createDependencyReducedPom>false</createDependencyReducedPom>
        <relocations>
          <relocation>
            <pattern>studio.mevera</pattern>
            <shadedPattern>your.package.libs.mevera</shadedPattern>
          </relocation>
        </relocations>
      </configuration>
    </execution>
  </executions>
</plugin>`;

    const groovy = `plugins {
    id 'com.gradleup.shadow' version '8.3.6'
  }

  java {
    toolchain {
      languageVersion = JavaLanguageVersion.of(17)
    }
  }

  tasks.named('shadowJar', com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar) {
    archiveClassifier.set('')
    relocate 'studio.mevera', 'your.package.libs.mevera'
  }

  assemble.dependsOn(tasks.named('shadowJar'))`;

    const kotlin = `plugins {
    id("com.gradleup.shadow") version "8.3.6"
  }

  java {
    toolchain {
      languageVersion.set(JavaLanguageVersion.of(17))
    }
  }

  tasks.named<com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar>("shadowJar") {
    archiveClassifier.set("")
    relocate("studio.mevera", "your.package.libs.mevera")
  }

  tasks.named("assemble") {
    dependsOn(tasks.named("shadowJar"))
  }`;

  return (
    <Tabs defaultValue="maven" group="java-build-tools">
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