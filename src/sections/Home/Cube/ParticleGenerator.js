import * as THREE from "three";

export default function generateParticles(imageData, width, height) {

    const positions = [];
    const originalPositions = [];
    const colors = [];
    const offsets = [];

    const data = imageData.data;

    const spacing = 2;
    const depth = 2.6;

    for (let y = 0; y < height; y += spacing) {

        for (let x = 0; x < width; x += spacing) {

            const index = (y * width + x) * 4;

            const alpha = data[index + 3];

            if (alpha < 80) continue;

            const px =
                (x - width / 2) * 0.13 +
                THREE.MathUtils.randFloatSpread(0.08);

            const py =
                -(y - height / 2) * 0.13 +
                THREE.MathUtils.randFloatSpread(0.08);

            createParticle(
                px,
                py,
                -depth / 2,
                true
            );

            createParticle(
                px,
                py,
                depth / 2,
                false
            );

        }

    }

    function createParticle(x, y, z, front) {

        const finalZ =
            z +
            THREE.MathUtils.randFloatSpread(0.03);

        positions.push(x, y, finalZ);

        originalPositions.push(
            x,
            y,
            finalZ
        );

        offsets.push(

            Math.random() * Math.PI * 2,

            Math.random() * Math.PI * 2,

            Math.random() * Math.PI * 2

        );

        /*
        -----------------------
        Brightness
        -----------------------
        */

        let brightness;

        const chance = Math.random();

        if (chance < 0.05) {

            brightness =
                THREE.MathUtils.randFloat(
                    1.35,
                    1.55
                );

        }

        else if (chance < 0.20) {

            brightness =
                THREE.MathUtils.randFloat(
                    0.45,
                    0.70
                );

        }

        else {

            brightness =
                THREE.MathUtils.randFloat(
                    0.90,
                    1.10
                );

        }

        let r, g, b;

        if (front) {

            r = 1;
            g = 1;
            b = 1;

        }

        else {

            r = 0.08;
            g = 0.92;
            b = 1;

        }

        r = Math.min(r * brightness, 1);
        g = Math.min(g * brightness, 1);
        b = Math.min(b * brightness, 1);

        colors.push(

            r,
            g,
            b

        );

    }

    return {

        positions: new Float32Array(
            positions
        ),

        originalPositions: new Float32Array(
            originalPositions
        ),

        offsets: new Float32Array(
            offsets
        ),

        colors: new Float32Array(
            colors
        )

    };

}