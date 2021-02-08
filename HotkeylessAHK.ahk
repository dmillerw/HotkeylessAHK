OutputDebug, Init

#Persistent
SetWorkingDir %A_ScriptDir%

#Include files/lib.ahk

OutputDebug, Menu

Menu, Tray, Icon, shell32.dll, 147
Menu, Tray, NoStandard
Menu, Tray, Add, &Stop, Stop

OutputDebug, Client/Server

SetupServer()
SetupClient()

OutputDebug, End

Return

Stop:
StopServer()
Return

StopServer() {
	OutputDebug, Stopping server
	
	Run curl ""http://localhost:42800/kill""
	
	ExitApp
}

; Standard Functions

Debug(msg) {
	MsgBox, %msg%
}

SendKeys(keys) {
	Send, %keys%
}

CustomTestFunc() {
	MsgBox, Hello
}