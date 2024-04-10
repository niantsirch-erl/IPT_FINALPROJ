// class PowerUp {
//     constructor({ x, y, radius, color, type }) {
//         this.x = x;
//         this.y = y;
//         this.radius = radius;
//         this.color = color;
//         this.type = type;
//         this.active = true;
//     }

//     draw() {
//         if (this.active) {
//             c.beginPath();
//             c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
//             c.fillStyle = this.color;
//             c.fill();
//             c.closePath();
//         }
//     }

//     checkCollision(projectile) {
//         const dist = Math.hypot(projectile.x - this.x, projectile.y - this.y);
//         if (dist - this.radius - projectile.radius < 1) {
//             // Power-up hit, apply effect and deactivate
//             this.active = false;
//             // Apply power-up effect to the projectile
//             if (this.type === 'slow') {
//                 projectile.velocity.x *= 0.5; // Example: reduce velocity by half
//                 projectile.velocity.y *= 0.5;
//             } else if (this.type === 'fast') {
//                 projectile.velocity.x *= 5; // Example: double the velocity
//                 projectile.velocity.y *= 5;
//             }
//             console.log(`Power-up hit by projectile with type: ${this.type} with the speed of ${projectile.velocity.x}`)
//         }

       
//     }
// }