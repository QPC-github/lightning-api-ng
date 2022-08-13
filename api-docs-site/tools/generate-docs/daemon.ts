import fs from 'fs-extra';
import path from 'path';
import { OUTPUT_DIR } from './constants';
import { Package } from './package';
import { JsonDaemon } from './types';

const { log } = console;

export class Daemon {
  name: string;
  packages = new Map<string, Package>();

  constructor(daemonName: string, json: JsonDaemon) {
    log(`Creating daemon ${daemonName} with ${json.files.length} proto files`);
    this.name = daemonName;
    json.files.forEach((f) => {
      let pkg = this.packages.get(f.package);
      if (!pkg) {
        pkg = new Package(f.package);
        this.packages.set(f.package, pkg);
      }
      pkg.addProtoFile(f, this);
    });
  }

  get camelName() {
    if (this.name === 'lnd') return 'LND';
    return this.name[0].toUpperCase() + this.name.substring(1);
  }

  getMessage(fullType: string) {
    const [pkg, msg] = fullType.split('.');

    if (!this.packages.has(pkg)) {
      throw new Error(`Cannot find package ${pkg} for ${fullType}`);
    }
    const file = this.packages.get(pkg);

    if (!file.messages.has(msg)) {
      throw new Error(
        `Cannot find message ${msg} for ${fullType} in the ${pkg} package`
      );
    }
    return file.messages.get(msg);
  }

  exportMarkdown() {
    log(`Exporting daemon ${this.camelName}`);

    this.packages.forEach((f) => f.exportMarkdown(this.name));

    const indexFilePath = path.join(OUTPUT_DIR, this.name, 'index.md');
    fs.writeFileSync(indexFilePath, `# ${this.camelName} API`);
  }
}
