
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

enum I2C_Sensors {
    I2C_DISTANCE_SENSOR = 0x2A
}

/**
 * Custom blocks
 */

//% weight=80 color=#0fbc11 icon="\uf0d1"
namespace distancesensor {

}

//% weight=99 color=#0fbc11 icon="\uf0d1"
namespace gobitgo {
    /**
     * TODO: describe your function here
     * @param n describe parameter here, eg: 5
     * @param s describe parameter here, eg: "Hello"
     * @param e describe parameter here
     */

    let PIMULT = 31416
    let PIDIV = 10000
    let WHEEL_BASE_WIDTH = 108
    let WHEEL_DIAMETER10 = 665
    let WHEEL_BASE_CIRCUMFERENCE = 339
    let WHEEL_CIRCUMFERENCE = WHEEL_DIAMETER10 * PIMULT / (10 * PIDIV)

    let MOTOR_GEAR_RATIO = 120
    let ENCODER_TICKS_PER_ROTATION = 6
    let MOTOR_TICKS_PER_DEGREE = (MOTOR_GEAR_RATIO * ENCODER_TICKS_PER_ROTATION) / 360

    let LINE_FOLLOWER_WHITE_THRESHOLD = 150
    let LINE_FOLLOWER_BLACK_THRESHOLD = 175
    let MOTOR_LEFT = 0x01
    let MOTOR_RIGHT = 0x02
    let ADDR = 0x04

    let init_done = false;

    let left_motor_dps = WhichSpeed.Normal
    let right_motor_dps = WhichSpeed.Normal
    let left_dir = WhichDriveDirection.Forward
    let right_dir = WhichDriveDirection.Forward
    let line_sensor = [0, 0, 0, 0, 0]
    let in_movement = false

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

    function target_reached(left_target_degrees: number, right_target_degrees: number): boolean {
        let tolerance = 5
        let min_left_target = left_target_degrees - tolerance
        let max_left_target = left_target_degrees + tolerance
        let min_right_target = right_target_degrees - tolerance
        let max_right_target = right_target_degrees + tolerance

        let current_left_position = get_motor_position(WhichUniqueMotor.Left)
        let current_right_position = get_motor_position(WhichUniqueMotor.Right)

        let right_is_reached = 0
        let left_is_reached = 0

        if (current_left_position > min_left_target) {
            left_is_reached += 1
        }
        if (current_left_position < max_left_target) {
            left_is_reached += 1
        }
        if (current_right_position > min_right_target) {
            right_is_reached += 1
        }
        if (current_right_position < max_right_target) {
            right_is_reached += 1
        }
        if (left_is_reached == 2 && right_is_reached == 2)
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

    function is_black(s: number): boolean {
        if (s > LINE_FOLLOWER_BLACK_THRESHOLD) {
            return true
        }
        return false
    }

    function is_white(s: number): boolean {
        if (s < LINE_FOLLOWER_WHITE_THRESHOLD) {
            return true
        }
        return false
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
        in_movement = true

        while (!target_reached(left_final_pos, right_final_pos)) {
        }
    }

    //% blockId="gobitgo_drive_straight" block="drive %dir"
    export function drive_straight(dir: WhichDriveDirection) {
        let dir_factor = 1
        if (dir == WhichDriveDirection.Backward) {
            dir_factor = -1
        }
        let avg_dps = (left_motor_dps + right_motor_dps) / 2
        set_motor_dps(WhichMotor.Both, avg_dps * dir_factor)
        in_movement = true
    }

    //% blockId="gobitgo_turn_X" block="turn %deg | degrees | %turn_dir"
    export function turn_X(deg: number, turn_dir: WhichTurnDirection) {

        let wheel_turn_degrees = WHEEL_BASE_CIRCUMFERENCE * deg / WHEEL_CIRCUMFERENCE
        if (turn_dir == WhichTurnDirection.Left) {
            wheel_turn_degrees *= -1
        }

        let left_start_position = get_motor_position(WhichUniqueMotor.Left)
        let right_start_position = get_motor_position(WhichUniqueMotor.Right)
        let left_final_position = left_start_position - wheel_turn_degrees
        let right_final_position = right_start_position + wheel_turn_degrees


        set_motor_position(MOTOR_LEFT, left_final_position)
        set_motor_position(MOTOR_RIGHT, right_final_position)
        in_movement = true
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

    /**
    * stops the robot
    */
    //% blockId="gobitgo_stop" block="stop"
    export function stop() {
        init()
        in_movement = false
        set_motor_power(WhichMotor.Both, 0)
    }

    /**
     * Will follow a black line until it finds itself over a black square or a white square
    */
    //% blockId="gobitgo_follow_line" block="follow the black line"
    export function follow_line() {
        let line_status = 0b00000
        in_movement = true
        while (in_movement) {
            get_raw_line_sensors()
            line_status = 0b00000
            for (let _i = 0; _i < line_sensor.length; _i++) {
                if (line_sensor[_i] > LINE_FOLLOWER_BLACK_THRESHOLD) {
                    line_status += 0b1 << _i
                }
                else if (line_sensor[_i] < LINE_FOLLOWER_WHITE_THRESHOLD) {
                    line_status += 0b0 << _i
                }
            }
            // if all black or all white
            if (line_status == 0b11111 || line_status == 0b0000) {
                stop()
                in_movement = false
            }
            // if centered
            if (line_status == 0b01110 || line_status == 0b00100) {
                drive_straight(WhichDriveDirection.Forward)
            }
            // if erring to the right
            else if (line_status == 0b11110 || line_status == 0b11100 || line_status == 0b11000 || line_status == 0b10000) {
                turn(WhichTurnDirection.Left)
            }
            // if erring to the left
            else if (line_status == 0b01111 || line_status == 0b00111 || line_status == 0b00011 || line_status == 0b00001) {
                turn(WhichTurnDirection.Right)
            }
        }
    }


    /**
     * Will return true if the whole line sensor is reading black, like when it's over a black square
    */
    //% blockId="gobitgo_test_black_line" block="black line is detected"
    export function test_black_line(): boolean {
        get_raw_line_sensors()
        for (let _i = 0; _i < line_sensor.length; _i++) {
            if (line_sensor[_i] < LINE_FOLLOWER_WHITE_THRESHOLD) {
                return false
            }
        }
        return true
    }

    /**
     * Will return true if the whole line sensor is reading white, like when it's over a blank page
    */
    //% blockId="gobitgo_test_white_line" block="white line is detected"
    export function test_white_line(): boolean {
        get_raw_line_sensors()
        for (let _i = 0; _i < line_sensor.length; _i++) {
            if (line_sensor[_i] > LINE_FOLLOWER_BLACK_THRESHOLD) {
                return false
            }
        }
        return true
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

        if (motor == WhichMotor.Left) {
            buf.setNumber(NumberFormat.UInt8BE, 1, MOTOR_LEFT)
        }
        else if (motor == WhichMotor.Right) {
            buf.setNumber(NumberFormat.UInt8BE, 1, MOTOR_RIGHT)

        }
        else if (motor == WhichMotor.Both) {
            buf.setNumber(NumberFormat.UInt8BE, 1, MOTOR_LEFT + MOTOR_RIGHT)
        }
        pins.i2cWriteBuffer(ADDR, buf, false);
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

        if (motor == WhichMotor.Left) {
            buf.setNumber(NumberFormat.UInt8BE, 1, MOTOR_LEFT)
        }
        else if (motor == WhichMotor.Right) {
            buf.setNumber(NumberFormat.UInt8BE, 1, MOTOR_RIGHT)
        }
        else {
            buf.setNumber(NumberFormat.UInt8BE, 1, MOTOR_LEFT + MOTOR_RIGHT)
        }
        pins.i2cWriteBuffer(ADDR, buf, false);
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

        let val = pins.i2cReadBuffer(ADDR, 4)
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
        let val = pins.i2cReadBuffer(ADDR, 2)
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
        pins.i2cWriteBuffer(ADDR, buf)
        let val = pins.i2cReadBuffer(ADDR, 2)
        return val.getNumber(NumberFormat.UInt16BE, 0);
    }


    //% blockId="gobitgo_read_raw_line_sensors" block="raw line sensors (x5)"
    //% advanced=true
    export function get_raw_line_sensors(): number[] {
        let buf = pins.createBuffer(1)
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.GET_LINE_SENSORS)
        pins.i2cWriteBuffer(ADDR, buf)
        let raw_buffer = pins.i2cReadBuffer(ADDR, 7)
        for (let _i = 0; _i < line_sensor.length; _i++) {
            line_sensor[_i] = raw_buffer.getNumber(NumberFormat.UInt8BE, _i)
        }
        return line_sensor
    }


}
