<?php

// @link https://github.com/seporaitis/bigpipe/blob/master/examples/openpipe.php
header("Cache-Control:private, no-cache, no-store, must-revalidate", true);
header("Pragma: no-cache", true);
header("Content-Type: text/html; charset=utf-8", true);

function full_flush() {
    ob_flush();
    flush();
}
?>
<!doctype html>
<html>
<head>
	<title>Simple</title>
</head>
<body>
<p data-pagelet="test">Foo</p>
<p data-pagelet="test2">Foo2</p>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js"></script>
<script src="../src/bigpipe.js"></script>
<script>var BigPipe = $.BigPipe({debug: true});</script>
<?php
	full_flush();
	sleep(2);
?>
<script>
BigPipe.onArrive({
	id:   'test',
	data: 'Bar',
	onStateChange: function(state, context) {
		if(2 >= state) {//HTML not yet injected
			context.target.html('Baz');
		}
	}
});
</script>
<?php
	full_flush();
	sleep(2);
?>
<script>
BigPipe.onArrive({
	id:   'test2',
	data: 'Bar2',
	onStateChange: function(state, context) {
		if(2 >= state) {//HTML not yet injected
			context.target.html('Baz2');
		}
	}
});
</script>
</body>
</html>