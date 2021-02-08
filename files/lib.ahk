SetupServer() {
    ; This snippet disables flashing console windows
    DllCall("AllocConsole")
    WinHide % "ahk_id " DllCall("GetConsoleWindow", "ptr")

    ; Starts the server using node js
    Run node ""files/build/index.js""
}

SetupClient() {
	SetTimer, ProcessCommand, 1
}

ProcessCommand() {
	OutputDebug, ProcessCommand
	shell := ComObjCreate("WScript.Shell")
    server := "curl http://localhost:42800/poll/command -m 1"
	exec := shell.Exec(ComSpec " /C " server)
	command := exec.StdOut.ReadAll()
	
	if (command == "") {
		Return
	}
	
	array := StrSplit(command, "\")
	
	Loop % array.MaxIndex() {
		cmd := array[A_Index]
		arg := ""
		IfInString, cmd, |
		{
		    OutputDebug, Command contains arguments

		    array1 := StrSplit(cmd, "|")
            cmd := array1[1]
		    arg := array1[2]
		}
		
		OutputDebug, Received cmd %cmd%
		OutputDebug, Received arg %arg%

		; Special case: kill. Reserved to terminate the script.
		if(cmd == "kill") {
			Run curl ""http://localhost:42800/kill""
			Exit
		} else {
		    if (cmd == "CustomFunc") {
		        cmd := arg
		    }

			; Calls a custom defined function in any included script.
			; Does ignore wrong calls (not defined functions).
			fn := Func(cmd)
			if(fn != 0) {
				%fn%(arg)
			}
		}
	}
}