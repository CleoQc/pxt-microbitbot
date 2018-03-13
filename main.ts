input.onButtonPressed(Button.A, () => {
    gobitgo.turn_X(90, WhichTurnDirection.Right)
})
input.onButtonPressed(Button.B, () => {
    gobitgo.turn_X(90, WhichTurnDirection.Left)
})
input.onButtonPressed(Button.AB, () => {
    gobitgo.stop()
})
basic.showNumber(gobitgo.get_motor_position(WhichUniqueMotor.Right))
gobitgo.stop()
basic.pause(5000)
