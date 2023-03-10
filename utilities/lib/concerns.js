const loadConcerns = (context, concerns) => {
  for(const concern of concerns) {
    // if not already loaded into context
    if(!Object.keys(context.concerns).includes(concern.blueprint.name)) {
      // first load any child concerns recursively
      if(concern.blueprint.concerns) {
        loadConcerns(context, concern.blueprint.concerns)
      }
      if(Object.keys(context.concerns).includes(concern.blueprint.name)) {
        throw Error('LoadConcerns error - child caused parent to load? :' + concern.blueprint.name)
      } else {
        context.concerns[concern.blueprint.name] = concern.New(context)
      }
    }
  }
}

module.exports = {loadConcerns}
