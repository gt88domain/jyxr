import Phaser from 'phaser';
import type { Battle } from './bridge';

class BattleScene extends Phaser.Scene {
  private battle?: Battle;
  private onCell: (x: number, y: number) => void;
  private ink?: Phaser.GameObjects.Container;
  constructor(onCell: (x: number, y: number) => void) {super('battle'); this.onCell = onCell;}
  create() {
    this.scale.on('resize', () => this.draw());
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.battle) return;
      const {cell, left, top} = this.geometry();
      const x = Math.floor((pointer.x - left) / cell), y = Math.floor((pointer.y - top) / cell);
      if (x >= 0 && y >= 0 && x < this.battle.width && y < this.battle.height) this.onCell(x, y);
    });
    this.draw();
  }
  updateBattle(battle: Battle) { this.battle = battle; if (this.sys.isActive()) this.draw(); }
  private geometry() {
    const b = this.battle!;
    const cell = Math.min((this.scale.width - 36) / b.width, (this.scale.height - 46) / b.height, 76);
    return {cell, left: (this.scale.width - cell * b.width) / 2, top: (this.scale.height - cell * b.height) / 2};
  }
  private draw() {
    if (!this.battle || !this.add) return;
    this.ink?.destroy(true);
    const layer = this.add.container(); this.ink = layer;
    const b = this.battle, {cell, left, top} = this.geometry();
    const grid = this.add.graphics(); layer.add(grid);
    grid.fillStyle(0x142b26, .62); grid.fillRoundedRect(left - 12, top - 12, cell * b.width + 24, cell * b.height + 24, 10);
    for (let y = 0; y < b.height; y++) for (let x = 0; x < b.width; x++) {
      const reachable = b.reachable.some(p => p.x === x && p.y === y);
      grid.fillStyle(reachable ? 0x88c7ad : (x + y) % 2 ? 0xe4dac0 : 0xc4bea7, reachable ? .36 : .12);
      grid.fillRect(left + x * cell + 1, top + y * cell + 1, cell - 2, cell - 2);
      grid.lineStyle(1, 0xc7bea0, .22); grid.strokeRect(left + x * cell, top + y * cell, cell, cell);
      if (reachable) {grid.fillStyle(0xa8d3b7, .65); grid.fillCircle(left + (x + .5) * cell, top + (y + .5) * cell, 2.5);}
    }
    for (const unit of b.units.filter(u => u.alive)) {
      const x = left + (unit.x + .5) * cell, y = top + (unit.y + .5) * cell;
      const active = unit.id === b.activeUnitId, radius = Math.max(11, cell * .29);
      grid.fillStyle(0x000000, .27); grid.fillEllipse(x, y + radius * .85, radius * 2.2, radius * .65);
      if (active) {grid.lineStyle(2, 0xf4d281, .95); grid.strokeCircle(x, y, radius + 5);}
      grid.fillStyle(unit.team === 1 ? 0x254f49 : 0x8a4a39, 1); grid.fillCircle(x, y, radius);
      grid.lineStyle(1, unit.team === 1 ? 0x92bdac : 0xd5a27e); grid.strokeCircle(x, y, radius);
      const glyph = unit.name.includes('木头') ? '木' : unit.name.slice(0, 1);
      layer.add(this.add.text(x, y, glyph, {fontFamily: 'serif', fontSize: `${Math.max(14, cell * .34)}px`, color: '#fff5dc'}).setOrigin(.5));
      const barWidth = Math.max(24, cell * .7), barY = y + radius + 7;
      grid.fillStyle(0x14201e, .8); grid.fillRoundedRect(x - barWidth / 2, barY, barWidth, 4, 2);
      grid.fillStyle(unit.team === 1 ? 0x96c5a3 : 0xd78f76); grid.fillRoundedRect(x - barWidth / 2, barY, barWidth * Math.max(0, unit.hp / unit.maxHp), 4, 2);
      if (cell > 42) layer.add(this.add.text(x, barY + 8, unit.name, {fontFamily: 'sans-serif', fontSize: '11px', color: '#f0e9d2'}).setOrigin(.5, 0));
    }
  }
}
export class Board {
  private game: Phaser.Game;
  private scene: BattleScene;
  constructor(parent: HTMLElement, onCell: (x: number, y: number) => void) {
    this.scene = new BattleScene(onCell);
    this.game = new Phaser.Game({type: Phaser.CANVAS, parent, transparent: true, audio: {noAudio: true}, banner: false,
      scale: {mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight}, scene: [this.scene],
      render: {antialias: true, roundPixels: true}});
  }
  update(battle: Battle) {this.scene.updateBattle(battle);}
  destroy() {this.game.destroy(true);}
}
