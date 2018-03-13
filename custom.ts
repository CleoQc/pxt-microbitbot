
/**
 * Use this file to define custom functions and blocks.
 * Read more at https://makecode.microbit.org/blocks/custom
 */

enum MyEnum {
    //% block="one"
    One,
    //% block="two"
    Two
}

enum WhichUniqueMotor {
    //% block="left motor"
    Left,
    //% block="right motor"
    Right
}
enum WhichMotor {
    //% block="both motors"
    Both,
    //% block="left motor"
    Left,
    //% block="right motor"
    Right
}

enum WhichDriveDirection {
    //% block="forward"
    Forward,
    //% block="backward"
    Backward
}
enum WhichTurnDirection {
    //% block="left"
    Left,
    //% block="right"
    Right
}

enum WhichUnitSystem {
    //% block="mm"
    mm,
    //% block="inches"
    inches
}

enum WhichSpeed {
    //% block="slowest"
    Slowest = 100,
    //% block="slower"
    Slower = 200,
    //% block="normal"
    Normal = 300,
    //% block="faster"
    Faster = 500,
    //% block="fastest"
    Fastest = 700
}

enum I2C_Commands {
    GET_FIRMWARE_VERSION = 1,
    GET_MANUFACTURER,
    GET_BOARD,
    GET_VOLTAGE_5V,
    GET_VOLTAGE_BATTERY,
    GET_LINE_SENSORS,
    GET_ENCODER_LEFT,
    GET_ENCODER_RIGHT,
    GET_MOTOR_STATUS_LEFT,
    GET_MOTOR_STATUS_RIGHT,
    SET_MOTOR_ENCODER_OFFSET,
    SET_MOTOR_POWER,
    SET_MOTOR_TARGET_POSITION,
    SET_MOTOR_TARGET_DPS,
    SET_MOTOR_LIMITS
}

/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon="\uf0d1"
namespace gobitgo {
    /**
     * TODO: describe your function here
     * @param n describe parameter here, eg: 5
     * @param s describe parameter here, eg: "Hello"
     * @param e describe parameter here
     */
    // let ADDR = 0x04
    let PIMULT = 31416
    let PIDIV = 10000
    let WHEEL_BASE_WIDTH = 108
    let WHEEL_DIAMETER10 = 665
    let WHEEL_BASE_CIRCUMFERENCE = 339
    let WHEEL_CIRCUMFERENCE = WHEEL_DIAMETER10 * PIMULT / (10 * PIDIV)

    let MOTOR_GEAR_RATIO = 120
    let ENCODER_TICKS_PER_ROTATION = 6
    let MOTOR_TICKS_PER_DEGREE = (MOTOR_GEAR_RATIO * ENCODER_TICKS_PER_ROTATION) / 360

    let init_done = false;

    let MOTOR_LEFT = 0x01
    let MOTOR_RIGHT = 0x02
    let ADDR = 0x04
    let left_motor_dps = WhichSpeed.Normal
    let right_motor_dps = WhichSpeed.Normal
    let left_dir = WhichDriveDirection.Forward
    let right_dir = WhichDriveDirection.Forward

    function reset_encoders() {
        //set_motor_power(WhichMotor.Both, 0)
        // let left_target = get_motor_position(MOTOR_LEFT)
        // let right_target = get_motor_position(MOTOR_RIGHT)
        offset_motor_encoder(MOTOR_LEFT, 0)
        offset_motor_encoder(MOTOR_RIGHT, 0)
    }

    function init() {
        if (init_done == false) {
            reset_encoders()
        }
        init_done = true;
    }

    function write8(register: number, value: number) {
        let buf = pins.createBuffer(2)
        // basic.showNumber(value)
        buf.setNumber(NumberFormat.UInt8BE, 0, register)
        buf.setNumber(NumberFormat.UInt8BE, 1, value)
        pins.i2cWriteBuffer(ADDR, buf, false);
    }

    function target_reached(left_target_degrees: number, right_target_degrees: number): boolean {
        let tolerance = 5
        let min_left_target = left_target_degrees - tolerance
        let max_left_target = left_target_degrees + tolerance
        let min_right_target = right_target_degrees - tolerance
        let max_right_target = right_target_degrees + tolerance

        let current_left_position = get_motor_position(WhichUniqueMotor.Left)
        let current_right_position = get_motor_position(WhichUniqueMotor.Right)

        if (current_left_position > min_left_target &&
            current_left_position < max_left_target &&
            current_right_position > min_right_target &&
            current_right_position < max_right_target)
            return true
        else
            return false
    }



    function offset_motor_encoder(motor: WhichUniqueMotor, offset: number) {
        offset = offset * MOTOR_TICKS_PER_DEGREE
        let buf = pins.createBuffer(6)
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.SET_MOTOR_ENCODER_OFFSET)
        if (motor == WhichUniqueMotor.Left) {
            buf.setNumber(NumberFormat.Int8LE, 1, MOTOR_LEFT)
        }
        if (motor == WhichUniqueMotor.Right) {
            buf.setNumber(NumberFormat.Int8LE, 1, MOTOR_RIGHT)
        }
        buf.setNumber(NumberFormat.UInt8BE, 2, (offset >> 24) & 0xFF)
        buf.setNumber(NumberFormat.UInt8BE, 3, (offset >> 16) & 0xFF)
        buf.setNumber(NumberFormat.UInt8BE, 4, (offset >> 8) & 0xFF)
        buf.setNumber(NumberFormat.UInt8BE, 5, offset & 0xFF)
        pins.i2cWriteBuffer(ADDR, buf, false);

    }

    ////////// BLOCKS

    //% blockId="gobitgo_drive_X" block="drive %dir| for |%dist | %unit"
    export function drive_X(dir: WhichDriveDirection, dist: number, unit: WhichUnitSystem) {
        init()
        left_dir = dir
        right_dir = dir
        let a = 0;
        if (unit == WhichUnitSystem.inches) {
            dist = dist * 100 / 254
        }
        if (dir == WhichDriveDirection.Backward) {
            dist = dist * -1
            left_dir = WhichDriveDirection.Backward
            right_dir = WhichDriveDirection.Backward
        }
        else {
            left_dir = WhichDriveDirection.Forward
            right_dir = WhichDriveDirection.Forward
        }
        let wheel_turn_degrees = (dist * 360) / WHEEL_CIRCUMFERENCE
        let left_starting_pos = get_motor_position(WhichUniqueMotor.Left)
        let right_starting_pos = get_motor_position(WhichUniqueMotor.Right)
        let left_final_pos = left_starting_pos + wheel_turn_degrees
        let right_final_pos = right_starting_pos + wheel_turn_degrees

        set_motor_position(WhichMotor.Left, left_final_pos)
        set_motor_position(WhichMotor.Right, right_final_pos)

        while (!target_reached(left_final_pos, right_final_pos)) {
        }
    }

    //% blockId="gobitgo_drive_straight" block="drive %dir"
    export function drive_straight(dir: WhichDriveDirection) {
        let dir_factor = 1
        if (dir == WhichDriveDirection.Backward) {
            dir_factor = -1
        }
        set_motor_dps(WhichMotor.Left, left_motor_dps * dir_factor)
        set_motor_dps(WhichMotor.Right, right_motor_dps * dir_factor)
    }

    //% blockId="gobitgo_turn_X" block="turn %deg | degrees | %turn_dir"
    export function turn_X(deg: number, turn_dir: WhichTurnDirection) {

        let wheel_turn_degrees = WHEEL_BASE_CIRCUMFERENCE * deg / WHEEL_CIRCUMFERENCE
        if (turn_dir == WhichTurnDirection.Left) {
            wheel_turn_degrees *= -1
        }
        basic.showNumber(wheel_turn_degrees)
        let left_start_position = get_motor_position(WhichUniqueMotor.Left)
        let right_start_position = get_motor_position(WhichUniqueMotor.Right)
        basic.showNumber(right_start_position)
        let left_final_position = left_start_position + wheel_turn_degrees
        let right_final_position = right_start_position - wheel_turn_degrees
        basic.showNumber(right_final_position)


        set_motor_position(MOTOR_LEFT, left_final_position)
        set_motor_position(MOTOR_RIGHT, right_final_position)
        while (!target_reached(left_final_position, right_final_position)) {
        }
    }

    //% blockId="gobitgo_turn" block="turn %turn_dir"
    export function turn(turn_dir: WhichTurnDirection) {
        let left_dps = left_motor_dps
        let right_dps = right_motor_dps
        if (turn_dir == WhichTurnDirection.Left) {
            left_dps = 0
        }
        else {
            right_dps = 0
        }
        set_motor_dps(WhichMotor.Left, left_dps)
        set_motor_dps(WhichMotor.Right, right_dps)
    }

    //% blockId="gobitgo_set_speed" block="set speed to %speed | on %motor"
    export function set_speed(speed: WhichSpeed, motor: WhichMotor) {
        init()
        if (motor != WhichMotor.Right) {
            if (left_dir == WhichDriveDirection.Backward) {
                left_motor_dps = speed * -1
            } else {
                left_motor_dps = speed
            }
            set_motor_dps_limit(WhichMotor.Left, speed)
        }
        if (motor != WhichMotor.Left) {
            if (right_dir == WhichDriveDirection.Backward) {
                right_motor_dps = speed * -1
            } else {
                right_motor_dps = speed
            }
            set_motor_dps_limit(WhichMotor.Right, speed)
        }

    }

    //% blockId="gobitgo_stop" block="stop"
    export function stop() {
        init()
        set_motor_power(WhichMotor.Both, 0)
    }

    /////////// MORE BLOCKS

    //% blockId="gobitgo_get_speed" block="%motor | speed"
    //% advanced=true
    export function get_speed(motor: WhichMotor): number {
        if (motor == WhichMotor.Left)
            return (left_motor_dps)
        if (motor == WhichMotor.Right)
            return (right_motor_dps)


        return ((left_motor_dps + right_motor_dps) / 2)
    }

    //% blockId="gobitgo_set_motor" block="set power on %motor| to | %power"
    //% advanced=true
    export function set_motor_power(motor: WhichMotor, power: number) {
        init()
        let buf = pins.createBuffer(3)
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.SET_MOTOR_POWER)
        buf.setNumber(NumberFormat.UInt8BE, 2, power)
        // activate left motor
        if (motor != WhichMotor.Right) {
            buf.setNumber(NumberFormat.UInt8BE, 1, 0x01)
            pins.i2cWriteBuffer(ADDR, buf, false);
        }
        // activate right motor
        if (motor != WhichMotor.Left) {
            buf.setNumber(NumberFormat.UInt8BE, 1, 0x02)
            pins.i2cWriteBuffer(ADDR, buf, false);
        }
    }

    //% blockId="gobitgo_set_motor_position" block="set position on %motor| to | %position"
    //% advanced=true
    export function set_motor_position(motor: WhichMotor, position: number) {
        init()
        let buf = pins.createBuffer(6)
        position = position * MOTOR_TICKS_PER_DEGREE
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.SET_MOTOR_TARGET_POSITION)
        buf.setNumber(NumberFormat.Int8BE, 2, (position >> 24) & 0xFF)
        buf.setNumber(NumberFormat.Int8BE, 3, (position >> 16) & 0xFF)
        buf.setNumber(NumberFormat.Int8BE, 4, (position >> 8) & 0xFF)
        buf.setNumber(NumberFormat.Int8BE, 5, position & 0xFF)

        if (motor != WhichMotor.Right) {
            buf.setNumber(NumberFormat.UInt8BE, 1, MOTOR_LEFT)
            pins.i2cWriteBuffer(ADDR, buf, false);
        }
        if (motor != WhichMotor.Left) {
            buf.setNumber(NumberFormat.UInt8BE, 1, MOTOR_RIGHT)
            pins.i2cWriteBuffer(ADDR, buf, false);
        }
    }

    //% blockId="gobitgo_set_motor_dps" block="set rotational speed on %motor| to | %position"
    //% advanced=true
    export function set_motor_dps(motor: WhichMotor, speed: WhichSpeed) {
        init()
        let buf = pins.createBuffer(4)
        speed = speed * MOTOR_TICKS_PER_DEGREE
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.SET_MOTOR_TARGET_DPS)
        buf.setNumber(NumberFormat.UInt8BE, 2, (speed >> 8) & 0xFF)
        buf.setNumber(NumberFormat.UInt8BE, 3, speed & 0xFF)

        if (motor != WhichMotor.Right) {
            buf.setNumber(NumberFormat.UInt8BE, 1, MOTOR_LEFT)
            pins.i2cWriteBuffer(ADDR, buf, false);
        }
        if (motor != WhichMotor.Left) {
            buf.setNumber(NumberFormat.UInt8BE, 1, MOTOR_RIGHT)
            pins.i2cWriteBuffer(ADDR, buf, false);
        }
    }

    //% blockId="gobitgo_set_motor_dps_limit" block="set rotational speed limit on %motor| to | %position"
    //% advanced=true
    export function set_motor_dps_limit(motor: WhichMotor, speed: WhichSpeed) {
        init()
        let buf = pins.createBuffer(5)
        speed = speed * MOTOR_TICKS_PER_DEGREE
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.SET_MOTOR_LIMITS)
        buf.setNumber(NumberFormat.UInt8BE, 1, 0)
        buf.setNumber(NumberFormat.UInt8BE, 3, (speed >> 8) & 0xFF)
        buf.setNumber(NumberFormat.UInt8BE, 4, speed & 0xFF)

        if (motor != WhichMotor.Right) {
            buf.setNumber(NumberFormat.UInt8BE, 1, MOTOR_LEFT)
            pins.i2cWriteBuffer(ADDR, buf, false);
        }
        if (motor != WhichMotor.Left) {
            buf.setNumber(NumberFormat.UInt8BE, 1, MOTOR_RIGHT)
            pins.i2cWriteBuffer(ADDR, buf, false);
        }
    }

    //% blockId="gobitgo_get_motor_position" block="encoder position for %motor"
    //% advanced=true
    export function get_motor_position(motor: WhichUniqueMotor): number {
        init()
        let buf = pins.createBuffer(1)
        if (motor == WhichUniqueMotor.Left) {
            buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.GET_ENCODER_LEFT)
        }
        if (motor == WhichUniqueMotor.Right) {
            buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.GET_ENCODER_RIGHT)
        }

        pins.i2cWriteBuffer(ADDR, buf)
        let val = pins.i2cReadBuffer(ADDR, 32)
        let encoder = val.getNumber(NumberFormat.Int32BE, 0) / MOTOR_TICKS_PER_DEGREE
        return encoder
    }


    //% blockId="gobitgo_get_firmware" block="firmware version number"
    //% advanced=true
    export function get_firmware(): number {
        /**
         * TODO: describe your function here
         * @param value describe value here, eg: 5
         */
        init()
        let buf = pins.createBuffer(1)
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.GET_FIRMWARE_VERSION)
        pins.i2cWriteBuffer(ADDR, buf)
        let val = pins.i2cReadBuffer(ADDR, 16)
        return val.getNumber(NumberFormat.UInt16BE, 0);
    }


    //% blockId="gobitgo_get_voltage" block="battery voltage (mv)"
    //% advanced=true
    export function get_voltage(): number {
        /**
         * TODO: describe your function here
         * @param value describe value here, eg: 5
         */
        init()
        let buf = pins.createBuffer(1)
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.GET_VOLTAGE_BATTERY)
        pins.i2cWriteBuffer(0x04, buf)
        let val = pins.i2cReadBuffer(ADDR, 16)
        return val.getNumber(NumberFormat.UInt16BE, 0);
    }



}
