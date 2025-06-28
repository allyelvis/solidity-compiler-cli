#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { program } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

program
  .name('solidity-compiler-cli')
  .description('A CLI tool to compile Solidity contracts')
  .version('1.0.0')
  .argument('<file>', 'Solidity file to compile')
  .option('-o, --output <path>', 'Output folder', 'build')
  .action((file, options) => {
    const filePath = path.resolve(file);

    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`❌ File not found: ${filePath}`));
      process.exit(1);
    }

    const source = fs.readFileSync(filePath, 'utf8');
    const input = {
      language: 'Solidity',
      sources: {
        [path.basename(filePath)]: {
          content: source
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        }
      }
    };

    console.log(chalk.cyan('🔍 Compiling...'));
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
      output.errors.forEach(err => {
        console.log(
          err.severity === 'error' ? chalk.red(err.formattedMessage) : chalk.yellow(err.formattedMessage)
        );
      });
    }

    if (!fs.existsSync(options.output)) {
      fs.mkdirSync(options.output);
    }

    for (const fileName in output.contracts) {
      for (const contract in output.contracts[fileName]) {
        const contractData = output.contracts[fileName][contract];
        const artifactPath = path.join(options.output, `${contract}.json`);
        fs.writeFileSync(artifactPath, JSON.stringify(contractData, null, 2));
        console.log(chalk.green(`✅ Compiled ${contract} -> ${artifactPath}`));
      }
    }
  });

program.parse();
