import { Tabs, CodeTabItem } from './docs/Tabs.tsx';

interface ShadingBlockProps {
  relocateFrom: string;
  relocateTo: string;
}

function parsePairs(from: string, to: string): { from: string; to: string }[] {
  const froms = from.split(',').map(s => s.trim());
  const tos = to.split(',').map(s => s.trim());
  return froms.map((f, i) => ({ from: f, to: tos[i] || f }));
}

export default function ShadingBlock({ relocateFrom = 'studio.mevera', relocateTo = 'your.package.libs.mevera' }: Partial<ShadingBlockProps>) {
  const pairs = parsePairs(relocateFrom, relocateTo);

  const mavenRelocations = pairs.map(p => `          <relocation>
            <pattern>${p.from}</pattern>
            <shadedPattern>${p.to}</shadedPattern>
          </relocation>`).join('\n');

  const groovyRelocations = pairs.map(p => `    relocate '${p.from}', '${p.to}'`).join('\n');
  const kotlinRelocations = pairs.map(p => `    relocate("${p.from}", "${p.to}")`).join('\n');

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
${mavenRelocations}
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
${groovyRelocations}
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
${kotlinRelocations}
  }

  tasks.named("assemble") {
    dependsOn(tasks.named("shadowJar"))
  }`;

  return (
    <Tabs defaultValue="maven" group="java-build-tools">
      <CodeTabItem value="maven" label="Maven" language="xml">{maven}</CodeTabItem>
      <CodeTabItem value="gradle-groovy" label="Gradle (Groovy)" language="groovy">{groovy}</CodeTabItem>
      <CodeTabItem value="gradle-kotlin" label="Gradle (Kotlin)" language="kotlin">{kotlin}</CodeTabItem>
    </Tabs>
  );
}