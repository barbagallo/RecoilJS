Base = $.boring.classes.Base

class $.boring.classes.UpdateBinding extends Base

  constructor: ( @$element, @scope, @parent, @root  ) ->
    binding = @$element.data( 'update' )
    csString = "-> #{ binding }"
    @func = @parseBinding( csString )
    @func()
    @pushBinding()

  update: ->
    @func()