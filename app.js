var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var sceneToRender = null;
var solution = [];
var createDefaultEngine = function () {
    return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false });
};

const createScene = () => {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 1.5, Math.PI / 2.5, 8, new BABYLON.Vector3(1, 0.8, 1));
    camera.attachControl(canvas, true);
    camera.upperRadiusLimit = 8;
    camera.lowerRadiusLimit = 8;
    camera.panningDistanceLimit = 1;

    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, 1));
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(-0.94, 0, -0.33));
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0.47, 0.81, -0.33));
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0.47, -0.81, -0.33));

    const blocks = [];
    const blockPosition = [];
    const cube = [[[], [], []], [[], [], []], [[], [], []]];
    const axises = ["position.x", "position.y", "position.z"];
    const blockAir = 13;
    const moveable = [4, 22, 10, 16, 12, 14];
    const framePerSecond = 60;
    const initStep = 0;


    const positionToIndex = (position) => {
        return position[0] * 9 + position[1] * 3 + position[2];
    }

    const indexToPosition = (index) => {
        return [Math.floor(index / 9), Math.floor((index % 9) / 3), index % 3];
    }

    const NumberFromImage = (number) => {
        if (number == 10)
            return new BABYLON.Vector4(0, 0, 0, 1);

        var columns = 9;
        var rows = 1;
        return new BABYLON.Vector4(number / columns, 0, (number + 1) / columns, 1 / rows);
    }

    const createBlock = (index) => {
        let position = indexToPosition(index);
        const faceNum = [];
        const mat = new BABYLON.StandardMaterial("mat");
        const texture = new BABYLON.Texture("https://raw.githubusercontent.com/WR104/WebDev/main/numbers.PNG");
        mat.diffuseTexture = texture;

        // faceNum[0]    //4th 
        // faceNum[1]    //2nd
        // faceNum[2]    //3rd
        // faceNum[3]    //1st
        // faceNum[4]    //up
        // faceNum[5]    //bottom
        faceNum[3] = position[0] == 0 ? NumberFromImage(8 - position[1] * 3 - position[2]) : NumberFromImage(10);
        faceNum[2] = position[0] == 2 ? NumberFromImage(6 - position[1] * 3 + position[2]) : NumberFromImage(10);
        faceNum[5] = position[1] == 0 ? NumberFromImage(position[0] + position[2] * 3) : NumberFromImage(10);
        faceNum[4] = position[1] == 2 ? NumberFromImage(6 + position[0] - position[2] * 3) : NumberFromImage(10);
        faceNum[1] = position[2] == 0 ? NumberFromImage(6 - position[1] * 3 + position[0]) : NumberFromImage(10);
        faceNum[0] = position[2] == 2 ? NumberFromImage(8 - position[1] * 3 - position[0]) : NumberFromImage(10);


        let block = new BABYLON.MeshBuilder.CreateBox(index,
            { faceUV: faceNum, width: 0.6, height: 0.6, depth: 0.6, wrap: true });

        block.material = mat;
        let realPosition = blockPosition[index];
        block.position = new BABYLON.Vector3(realPosition[0], realPosition[1], realPosition[2]);

        block.enableEdgesRendering();
        block.edgesWidth = 4.0;
        block.edgesColor = new BABYLON.Color4(0, 0, 0, 1);

        block.renderOutline = true;
        block.outlineColor = new BABYLON.Color3(1, 1, 1);
        block.outlineWidth = 0.01;

        return block;
    }

    const move = (index) => {
        let direction = moveable.indexOf(index);
        if (direction < 0) {
            return false;
        }

        let positionBlock = blockPosition[index];
        let positionAir = blockPosition[blockAir];

        blockPosition[index] = positionAir;
        blockPosition[blockAir] = positionBlock;

        cube[positionBlock[0]][positionBlock[1]][positionBlock[2]] = blockAir;
        cube[positionAir[0]][positionAir[1]][positionAir[2]] = index;

        let position = blockPosition[blockAir];
        moveable[0] = position[0] > 0 ? cube[position[0] - 1][position[1]][position[2]] : blockAir;
        moveable[1] = position[0] < 2 ? cube[position[0] + 1][position[1]][position[2]] : blockAir;
        moveable[2] = position[1] > 0 ? cube[position[0]][position[1] - 1][position[2]] : blockAir;
        moveable[3] = position[1] < 2 ? cube[position[0]][position[1] + 1][position[2]] : blockAir;
        moveable[4] = position[2] > 0 ? cube[position[0]][position[1]][position[2] - 1] : blockAir;
        moveable[5] = position[2] < 2 ? cube[position[0]][position[1]][position[2] + 1] : blockAir;

        return true;
    }

    const physicalMove = (index) => {
        let direction = moveable.indexOf(index);
        if (direction < 0) {
            return;
        }
        let axis = Math.floor(direction / 2);

        let positionBlock = blockPosition[index];
        let positionAir = blockPosition[blockAir];

        let anim = new BABYLON.Animation(axis, axises[axis], framePerSecond,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        anim.setKeys([{ frame: 0, value: positionAir[axis] }, { frame: 14, value: positionBlock[axis] }]);

        scene.beginDirectAnimation(blocks[index], [anim], 0, 14, false);
    }

    const pointerDown = (mesh) => {
        let index = Number(mesh.name);
        // alert(index);
        let positionAir = blockPosition[blockAir];
        if (move(index)) {
            physicalMove(index);
            solution.push(cube[positionAir[0]][positionAir[1]][positionAir[2]]);

            let num = 0;
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 3; y++) {
                    for (let z = 0; z < 3; z++) {
                        if (cube[x][y][z] != num) {
                            return;
                        }
                        num++;
                    }
                }
            }
            setTimeout(() => {
                alert("YOU WIN!");
            }, 250);
        }
    }



    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                if (pointerInfo.pickInfo.hit) {
                    pointerDown(pointerInfo.pickInfo.pickedMesh)
                }
                break;
        }
    });



    //init cube
    for (let index = 0; index < 27; index++) {
        let position = indexToPosition(index);
        cube[position[0]][position[1]][position[2]] = index;
        blockPosition[index] = indexToPosition(index);
    }

    //disorganize
    const disorganize = () => {
        let lastDirection = 6;
        for (let i = 0; ; i++) {
            let count = 0;
            for (let j = 0; j < 6; j++) {
                if (j != lastDirection && moveable[j] != blockAir) {
                    count++;
                }
            }
            let num = Math.floor(Math.random() * count) + 1;
            for (let j = 0; j < 6; j++) {
                if (j != lastDirection && moveable[j] != blockAir) {
                    num--;
                }
                if (num == 0) {
                    let positionAir = blockPosition[blockAir];
                    move(moveable[j]);
                    solution.push(cube[positionAir[0]][positionAir[1]][positionAir[2]]);

                    lastDirection = j % 2 == 0 ? j + 1 : j - 1;
                    break;
                }
            }
            if (i >= initStep && cube[1][1][1] == blockAir) {
                break;
            }
        }
    }

    disorganize();
    solution.unshift(13);   //the final step

    for (let index = 0; index < 27; index++) {
        if (index != blockAir) {
            blocks[index] = createBlock(index);
        }
    }


    //UI
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
    var button = BABYLON.GUI.Button.CreateSimpleButton("but", "Solve");
    button.width = "0.08vh";
    button.height = "0.05vh";
    button.top = "40%";
    button.color = "white";
    button.background = "black";
    button.cornerRadius = 20;
    button.thickness = 2;
    advancedTexture.addControl(button);


    button.onPointerUpObservable.add(function () {
        if (solution.length != 0) {
            var step = solution.pop();
            if (move(step))
                physicalMove(step);
        }
    })

    return scene;
}



window.initFunction = async function () {
    var asyncEngineCreation = async function () {
        try {
            return createDefaultEngine();
        } catch (e) {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine();
        }
    }
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    window.engine = await asyncEngineCreation();
    if (!engine) throw 'engine should not be null.';
    window.scene = createScene();
};

initFunction().then(() => {
    sceneToRender = scene
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
});

// Resize
window.addEventListener("resize", function () {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    engine.resize();
});