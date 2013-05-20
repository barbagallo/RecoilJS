Base = $.boring.classes.Base

class $.boring.classes.IfBinding extends Base

  constructor: ( @$element, @scope, @parent, @root, @callback ) ->
    @binding = @$element.data( 'if' )
    @insertPlaceholder()
    @setValue()
    @pushBinding()

  setValue: ->
    value = @parseBinding @binding
    if @value isnt value
      @value = value
      if @value
        @$element.insertAfter( @$placeholder )
        @unwrap()
      else
        @wrap()
        @$element.detach()

  update: ->
    @setValue()