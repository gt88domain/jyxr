import Phaser from 'phaser';

// Canvas-compatible layers: original art needs no normal maps or new assets.
export class BattleLighting {
  private ambient: Phaser.GameObjects.Image;
  private focus: Phaser.GameObjects.Image;
  private width = 0;
  private height = 0;
  constructor(private scene: Phaser.Scene) {
    for (const [name, color] of [['warm', '255,211,140'], ['healing', '143,232,183'], ['impact', '255,173,113']]) {
      const texture = scene.textures.createCanvas('battle-light-' + name, 128, 128)!;
      const context = texture.context;
      const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64);
      gradient.addColorStop(0, `rgba(${color},.8)`);gradient.addColorStop(.35, `rgba(${color},.3)`);gradient.addColorStop(1, `rgba(${color},0)`);
      context.fillStyle = gradient;context.fillRect(0, 0, 128, 128);texture.refresh();
    }
    scene.textures.createCanvas('battle-ambient', 1, 1);
    this.ambient = scene.add.image(0, 0, 'battle-ambient').setOrigin(0).setDepth(-5);
    this.focus = scene.add.image(0, 0, 'battle-light-warm').setDepth(0).setBlendMode(Phaser.BlendModes.SCREEN).setAlpha(.4);
  }
  update(width: number, height: number, x: number, y: number, cell: number, enabled: boolean) {
    this.ambient.setVisible(enabled);this.focus.setVisible(enabled);
    if (!enabled) return;
    if (width !== this.width || height !== this.height) {
      this.width = width;this.height = height;
      const texture = this.scene.textures.get('battle-ambient') as Phaser.Textures.CanvasTexture;
      texture.setSize(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
      const context = texture.context;
      context.clearRect(0, 0, width, height);
      const shade = context.createRadialGradient(width * .5, height * .56, height * .12, width * .5, height * .56, Math.max(width, height) * .63);
      shade.addColorStop(0, 'rgba(14,26,29,0)');shade.addColorStop(.55, 'rgba(14,26,29,.08)');shade.addColorStop(1, 'rgba(9,20,27,.48)');
      context.fillStyle = shade;context.fillRect(0, 0, width, height);
      const sunlight = context.createLinearGradient(0, 0, width, height);
      sunlight.addColorStop(0, 'rgba(255,217,151,.13)');sunlight.addColorStop(.65, 'rgba(255,217,151,0)');sunlight.addColorStop(1, 'rgba(39,61,77,.08)');
      context.fillStyle = sunlight;context.fillRect(0, 0, width, height);texture.refresh();
      this.ambient.setDisplaySize(width, height);
    }
    this.focus.setPosition(x, y).setDisplaySize(cell * 2.4, cell * 1.15);
  }
  flash(x: number, y: number, cell: number, healing: boolean, speed: number) {
    const light = this.scene.add.image(x, y, 'battle-light-' + (healing ? 'healing' : 'impact'))
      .setDepth(5).setDisplaySize(cell * 1.8, cell * 1.8).setBlendMode(Phaser.BlendModes.SCREEN).setAlpha(.6);
    this.scene.tweens.add({targets: light, alpha: 0, duration: 340 / speed, onComplete: () => light.destroy()});
  }
}
