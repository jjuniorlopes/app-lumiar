class CulturalItemModel {
  final int id;
  final String code;
  final String title;
  final String? author;
  final String? year;
  final String? category;
  final String? imageUrl;
  final String? audioUrl;
  final String? shortDescription;
  final String audioDescription;
  final bool isReviewed;
  final String spaceName;
  final String organizationName;
  final String organizationSlug;

  CulturalItemModel({
    required this.id,
    required this.code,
    required this.title,
    this.author,
    this.year,
    this.category,
    this.imageUrl,
    this.audioUrl,
    this.shortDescription,
    required this.audioDescription,
    required this.isReviewed,
    required this.spaceName,
    required this.organizationName,
    required this.organizationSlug,
  });

  factory CulturalItemModel.fromJson(Map<String, dynamic> json) {
    return CulturalItemModel(
      id: json['id'] ?? 0,
      code: json['code'] ?? '',
      title: json['title'] ?? '',
      author: json['author'],
      year: json['year'],
      category: json['category'],
      imageUrl: json['image_url'],
      audioUrl: json['audio_url'],
      shortDescription: json['short_description'],
      audioDescription: json['audio_description'] ?? 'Sem audiodescrição disponível.',
      isReviewed: json['is_reviewed'] ?? false,
      spaceName: json['space'] != null ? (json['space']['name'] ?? '') : 'Exposição Geral',
      organizationName: json['organization'] != null ? (json['organization']['name'] ?? '') : 'Lumiar Cultural',
      organizationSlug: json['organization'] != null ? (json['organization']['slug'] ?? '') : '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'title': title,
      'author': author,
      'year': year,
      'category': category,
      'image_url': imageUrl,
      'audio_url': audioUrl,
      'short_description': shortDescription,
      'audio_description': audioDescription,
      'is_reviewed': isReviewed,
      'space': {'name': spaceName},
      'organization': {'name': organizationName, 'slug': organizationSlug},
    };
  }
}

